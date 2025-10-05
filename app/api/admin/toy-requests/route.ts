import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { ToyRequest } from '@/models/ToyRequest';
import { MasterCatalog } from '@/models/MasterCatalog';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin using the admin field
    if (!session?.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    if (status !== 'ALL') {
      query.status = status;
    }

    const requests = await ToyRequest.find(query)
      .sort({ requestedAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();

    const totalCount = await ToyRequest.countDocuments(query);

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        totalCount,
        hasMore: (page + 1) * limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching toy requests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch requests' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin using the admin field
    if (!session?.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await dbConnect();

    const { requestId, action, reviewNotes, catalogData } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ 
        error: 'Request ID and action are required' 
      }, { status: 400 });
    }

    const toyRequest = await ToyRequest.findById(requestId);
    if (!toyRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    let updatedRequest;

    switch (action) {
      case 'APPROVE':
        updatedRequest = await ToyRequest.findByIdAndUpdate(requestId, {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: session.user.email,
          reviewNotes: reviewNotes || 'Approved for addition to catalog'
        }, { new: true });
        break;

      case 'REJECT':
        updatedRequest = await ToyRequest.findByIdAndUpdate(requestId, {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: session.user.email,
          reviewNotes: reviewNotes || 'Request rejected'
        }, { new: true });
        break;

      case 'ADD_TO_CATALOG':
        // Create catalog item from the request data
        if (!catalogData) {
          return NextResponse.json({ 
            error: 'Catalog data required for adding to catalog' 
          }, { status: 400 });
        }

        const catalogItem = await MasterCatalog.create({
          title: catalogData.title || toyRequest.itemTitle,
          brand: catalogData.brand,
          category: catalogData.category,
          description: catalogData.description || toyRequest.itemDescription,
          gender: catalogData.gender || 'neutral',
          ageMin: catalogData.ageMin,
          ageMax: catalogData.ageMax,
          price: catalogData.price,
          retailer: catalogData.retailer,
          productUrl: catalogData.productUrl || toyRequest.itemUrl || '',
          imageUrl: catalogData.imageUrl,
          sku: catalogData.sku,
          tags: catalogData.tags || [],
          popularity: catalogData.popularity,
          sourceType: catalogData.sourceType || 'manual',
          isActive: catalogData.isActive !== undefined ? catalogData.isActive : true
        });

        updatedRequest = await ToyRequest.findByIdAndUpdate(requestId, {
          status: 'ADDED_TO_CATALOG',
          reviewedAt: new Date(),
          reviewedBy: session.user.email,
          reviewNotes: reviewNotes || 'Added to master catalog',
          catalogItemId: catalogItem._id
        }, { new: true });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Request ${action.toLowerCase()}d successfully`,
      request: updatedRequest
    });

  } catch (error) {
    console.error('Error updating toy request:', error);
    return NextResponse.json({ 
      error: 'Failed to update request' 
    }, { status: 500 });
  }
}