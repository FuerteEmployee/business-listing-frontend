import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function SubCategoryGrid({ parentCategory, subCategories }) {
    return (
        <div className="bg-white pb-16">
            {/* Category Banner/Header */}
            <div className="bg-slate-50 border-b border-slate-200 py-10 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-slate-900">{parentCategory?.name}</h1>
                    <p className="text-slate-600 mt-2">Choose a sub-category to narrow down your search</p>
                </div>
            </div>

            {/* Sub-Category Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {subCategories.map((sub) => (
                        <Link
                            key={sub._id}
                            to={`/search?category=${sub.slug}`}
                            className="group flex flex-col items-center gap-4 text-center"
                        >
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 group-hover:border-orange-200 group-hover:shadow-md transition-all aspect-square">
                                {sub.image ? (
                                    <img 
                                        src={sub.image} 
                                        alt={sub.name} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="text-orange-500">
                                        <ShoppingCart className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                {sub.name}
                            </h3>
                        </Link>
                    ))}
                </div>
                
                {subCategories.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-500">No sub-categories found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
